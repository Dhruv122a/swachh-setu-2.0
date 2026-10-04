import { Badge } from "./Badges";

export const StatusBadge = ({ status, ...p }) => <Badge kind="status" value={status} {...p} />;
