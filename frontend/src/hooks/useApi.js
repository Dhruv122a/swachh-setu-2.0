import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(fn, deps = []) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
  });

  // Always keep the latest API function
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setState((s) => ({
          ...s,
          loading: true,
          error: null,
        }));
      }

      try {
        const data = await fnRef.current();

        setState({
          data,
          error: null,
          loading: false,
        });
      } catch (e) {
        setState({
          data: null,
          error: e?.message || "Something went wrong",
          loading: false,
        });
      }
    },

    // deps control when the API should reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load,

    setData: (data) =>
      setState((s) => ({
        ...s,
        data,
      })),
  };
}