import { useEffect, useRef, useState } from "react";
import { generateModel, type GeneratedModel } from "../core/engine";
import type { Model } from "../core/project";
export function useModel(model: Model | null) {
  const key = JSON.stringify(model),
    controller = useRef<AbortController | null>(null);
  const [retry, setRetry] = useState(0),
    [state, setState] = useState<{
      key: string;
      result: GeneratedModel | null;
      busy: boolean;
      error: string;
    }>({ key: "", result: null, busy: false, error: "" });
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    setState({ key, result: null, busy: !!model, error: "" });
    if (!model) return () => abort.abort();
    const timer = setTimeout(() => {
      generateModel(model, abort.signal)
        .then((result) => {
          if (!abort.signal.aborted)
            setState({ key, result, busy: false, error: "" });
        })
        .catch((e) => {
          if (!abort.signal.aborted)
            setState({ key, result: null, busy: false, error: e.message });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [key, retry]);
  return {
    result: state.key === key ? state.result : null,
    busy: state.key !== key ? !!model : state.busy,
    error: state.key === key ? state.error : "",
    retry: () => setRetry((n) => n + 1),
    cancel: () => {
      controller.current?.abort();
      setState({
        key,
        result: null,
        busy: false,
        error: "Generation cancelled. Generate again when ready.",
      });
    },
  };
}
