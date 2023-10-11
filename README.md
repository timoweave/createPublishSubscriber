# Introduction

Inspired by Jack Herrington's blasting fast react context video.
https://www.youtube.com/watch?v=ZKlXqrcBx88. Thank you Jack!

Use both `useSyncExternalStore` and `useRef` to share states in context/provider between react components,instead of `useState`, to just re-render only component that subscribes to a subset state that is published (or changed).

# Example
```ts
interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipcode: number;
}

const ieAddress: Address = {
  street1: "1 hack drive",
  city: "menlo park",
  state: "CA",
  zipcode: 94025,
};

test("only subscribe to street1 from the createPubSub<Address>", () => {
    const { useSub, PubProvider: wrapper } = createPubSub<Address>(ieAddress);
    const useStreet1 = () => useSub((s) => s.street1)
    const rendered = renderHook(() => useStreet1(), { wrapper });
    const street1 = () => rendered.result.current;

    expect(street1().data).toEqual(ieAddress.street1);

    act(() => street1().setData({ street2: "PO Box 123" }));
    expect(street1().data).toEqual(ieAddress.street1);
  });
```