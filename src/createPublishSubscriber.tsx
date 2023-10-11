import React, {
  useRef,
  useCallback,
  useSyncExternalStore,
  createContext,
  useContext,
} from "react";

export interface PublishSubscriber<StoreData, StoreMember = StoreData> {
  data: StoreMember;
  setData: (value: Partial<StoreData>) => void;
}

export interface CreatePublishSubscriber<StoreData> {
  PubProvider: (props: React.PropsWithChildren) => React.JSX.Element;
  useSub: <StoreMember>(
    selectStoreMember: (store: StoreData) => StoreMember,
  ) => PublishSubscriber<StoreData, StoreMember>;
}

export function createPublishSubscriber<StoreData>(
  initialState: StoreData,
): CreatePublishSubscriber<StoreData> {
  type Callback = () => void;

  type PubSubContextType = {
    get: () => StoreData;
    set: (value: Partial<StoreData>) => void;
    subscribe: (callback: Callback) => Callback;
  };

  const PubSubContext = createContext<PubSubContextType>({
    get: () => initialState,
    set: (v: Partial<StoreData>): void => {
      v;
    },
    subscribe: (cb: Callback): Callback => {
      return cb;
    },
  });

  function usePubSub(initialStore: StoreData): PubSubContextType {
    const store = useRef<StoreData>(initialStore);
    const subscribers = useRef<Set<Callback>>(new Set<Callback>());

    const get = useCallback((): StoreData => {
      return store.current;
    }, []);

    const set = useCallback((value: Partial<StoreData>): void => {
      store.current = { ...store.current, ...value };
      subscribers.current.forEach((callback: Callback): void => {
        callback();
      });
    }, []);

    const subscribe = useCallback((callback: Callback): Callback => {
      subscribers.current.add(callback);
      const unsubscribe = () => {
        subscribers.current.delete(callback);
      };
      return unsubscribe as Callback;
    }, []);

    return {
      get,
      set,
      subscribe,
    };
  }

  const PubProvider = (props: React.PropsWithChildren) => {
    const pubSub = usePubSub(initialState);

    return (
      <PubSubContext.Provider value={pubSub}>
        <div>{props.children}</div>
      </PubSubContext.Provider>
    );
  };

  function useSub<StoreMember>(
    selectStoreMember: (store: StoreData) => StoreMember,
  ) {
    const context = useContext(PubSubContext);
    const data = useSyncExternalStore(
      (onChange) => context.subscribe(onChange),
      () => selectStoreMember(context.get()),
    );
    return { data, setData: context.set };
  }

  return { PubProvider, useSub };
}
