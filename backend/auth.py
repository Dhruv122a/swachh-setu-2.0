"""JWT email/password auth. Roles: citizen (self sign-up) and admin (seeded from .env only)."""
import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

JWT_ALGORITHM = "HS256"
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
auth_router = APIRouter(prefix="/api/auth")


def hash_password(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p, h):
    return bcrypt.checkpw(p.encode(), h.encode())


def make_token(user_id, kind, ttl):
    payload = {"sub": user_id, "type": kind, "exp": datetime.now(timezone.utc) + ttl}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_cookies(response, user_id):
    opts = dict(httponly=True, secure=True, samesite="none", path="/")
    response.set_cookie("access_token", make_token(user_id, "access", timedelta(minutes=15)), max_age=900, **opts)
    response.set_cookie("refresh_token", make_token(user_id, "refresh", timedelta(days=7)), max_age=604800, **opts)


def public_user(u):
    return {"id": str(u["_id"]), "email": u["email"], "name": u.get("name", ""), "role": u.get("role", "citizen"),
            "ward": u.get("ward")}


def decode(token, kind):
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    if payload.get("type") != kind:
        raise HTTPException(401, "Invalid token type")
    return payload


async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    header = request.headers.get("Authorization", "")
    if not token and header.startswith("Bearer "):
        token = header[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    payload = decode(token, "access")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "User not found")
    return public_user(user)


async def optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Municipal officer access only")
    return user


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    ward: int | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@auth_router.post("/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "An account with this email already exists")
    doc = {"email": email, "name": body.name.strip(), "role": "citizen", "ward": body.ward,
           "password_hash": hash_password(body.password), "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    set_cookies(response, str(res.inserted_id))
    return public_user({**doc, "_id": res.inserted_id})


@auth_router.post("/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ident = f"{request.client.host if request.client else 'x'}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": ident})
    now = datetime.now(timezone.utc)
    if attempt and attempt.get("count", 0) >= 5 and datetime.fromisoformat(attempt["last"]) > now - timedelta(minutes=15):
        raise HTTPException(429, "Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one({"identifier": ident}, {"$inc": {"count": 1}, "$set": {"last": now.isoformat()}}, upsert=True)
        raise HTTPException(401, "Invalid email or password")
    await db.login_attempts.delete_one({"identifier": ident})
    set_cookies(response, str(user["_id"]))
    return public_user(user)


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return {"ok": True}


@auth_router.get("/me")
async def me(user=Depends(get_current_user)):
    return user


@auth_router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "No refresh token")
    payload = decode(token, "refresh")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "User not found")
    response.set_cookie("access_token", make_token(payload["sub"], "access", timedelta(minutes=15)), max_age=900,
                        httponly=True, secure=True, samesite="none", path="/")
    return public_user(user)


async def init_auth():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    email, password = os.environ["ADMIN_EMAIL"].lower(), os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({"email": email, "name": "Municipal Admin", "role": "admin", "ward": None,
                                   "password_hash": hash_password(password), "created_at": datetime.now(timezone.utc).isoformat()})
    else:
        update = {"role": "admin"}
        if not verify_password(password, existing["password_hash"]):
            update["password_hash"] = hash_password(password)
        await db.users.update_one({"email": email}, {"$set": update})
