import { describe, test, expect } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { createPubSub } from "../createPublishSubscriber";

describe("single key/value", () => {
  test("string case", () => {
    interface Name {
      name: string;
    }
    const { useSub, PubProvider: wrapper } = createPubSub<Name>({ name: "" });
    const rendered = renderHook(() => useSub((s) => s.name), { wrapper });
    const name = () => rendered.result.current;

    expect(name().data).toEqual("");

    act(() => name().setData({ name: "peter pan" }));
    expect(name().data).toEqual("peter pan");
  });

  test("boolean case", () => {
    interface Flag {
      flag: boolean;
    }
    const { useSub, PubProvider: wrapper } = createPubSub<Flag>({
      flag: false,
    });
    const rendered = renderHook(() => useSub((s) => s.flag), { wrapper });
    const flag = () => rendered.result.current;

    expect(flag().data).toEqual(false);

    act(() => flag().setData({ flag: true }));
    expect(flag().data).toEqual(true);
  });

  test("number case", () => {
    interface Quantity {
      quantity: number;
    }
    const { useSub, PubProvider: wrapper } = createPubSub<Quantity>({
      quantity: 0,
    });
    const rendered = renderHook(() => useSub((s) => s.quantity), { wrapper });
    const quantity = () => rendered.result.current;

    expect(quantity().data).toEqual(0);

    act(() => quantity().setData({ quantity: 10 }));
    expect(quantity().data).toEqual(10);

    act(() => quantity().setData({ quantity: 20 }));
    expect(quantity().data).toEqual(20);

    act(() => quantity().setData({ quantity: -3 }));
    expect(quantity().data).toEqual(-3);
  });

  test("number list case", () => {
    interface Numbers {
      numbers: number[];
    }
    const { useSub, PubProvider: wrapper } = createPubSub<Numbers>({
      numbers: [],
    });
    const rendered = renderHook(() => useSub((s) => s.numbers), { wrapper });
    const numbers = () => rendered.result.current;

    expect(numbers().data).toEqual([]);

    act(() => numbers().setData({ numbers: [10] }));
    expect(numbers().data).toEqual([10]);

    act(() => numbers().setData({ numbers: [10, 20] }));
    expect(numbers().data).toEqual([10, 20]);

    act(() => numbers().setData({ numbers: [10, 20, -3] }));
    expect(numbers().data).toEqual([10, 20, -3]);

    act(() => numbers().setData({ numbers: [-3, 3] }));
    expect(numbers().data).toEqual([-3, 3]);
  });

  test("lookup case", () => {
    type Lookup = Record<string, number>;

    const { useSub, PubProvider: wrapper } = createPubSub<Lookup>({});
    const renderedAll = renderHook(() => useSub((s) => s), { wrapper });
    const lookup = () => renderedAll.result.current;

    expect(lookup().data).toEqual({});

    act(() => lookup().setData({ peter_pan: 10 }));
    expect(lookup().data["peter_pan"]).toEqual(10);

    act(() => lookup().setData({ tinker_bell: 20 }));
    expect(lookup().data["peter_pan"]).toEqual(10);
    expect(lookup().data["tinker_bell"]).toEqual(20);

    act(() => lookup().setData({ tiger_lily: -3 }));
    expect(lookup().data["peter_pan"]).toEqual(10);
    expect(lookup().data["tinker_bell"]).toEqual(20);
    expect(lookup().data["tiger_lily"]).toEqual(-3);
  });
});

describe("multiple key/value", () => {
  interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipcode: number;
  }

  const hack: Address = {
    street1: "1 hack drive",
    city: "menlo park",
    state: "CA",
    zipcode: 94025,
  };

  test("all address case", () => {
    const { useSub, PubProvider: wrapper } = createPubSub<Address>(hack);
    const rendered = renderHook(() => useSub((s) => s), { wrapper });

    const address = () => rendered.result.current;
    expect(address().data).toEqual({ ...hack });

    act(() => address().setData({ street2: "PO Box 123" }));
    expect(address().data.street2).toEqual("PO Box 123");
    expect(address().data).toEqual({ ...hack, street2: "PO Box 123" });
  });

  test("street1 address case", () => {
    const { useSub, PubProvider: wrapper } = createPubSub<Address>(hack);
    const useStreet1 = () => useSub((s) => s.street1);
    const rendered = renderHook(() => useStreet1(), { wrapper });

    const street1 = () => rendered.result.current;
    expect(street1().data).toEqual(hack.street1);

    act(() => street1().setData({ street2: "PO Box 123" }));
    expect(street1().data).toEqual(hack.street1);
  });
});

describe("nested key/value", () => {
  test("tree case", () => {
    type Node = {
      value: number;
      left?: Node;
      right?: Node;
    };
    // 1. init
    //    0
    //  /   \
    // -5    3
    //        \
    //         6
    const initTree: Node = {
      value: 0,
      left: {
        value: -5,
      },
      right: {
        value: 3,
        right: {
          value: 6,
        },
      },
    };

    const { useSub, PubProvider: wrapper } = createPubSub<Node>(initTree);
    const rendered = renderHook(() => useSub((s) => s), { wrapper });
    const tree = () => rendered.result.current;

    expect(tree().data).toEqual({ ...initTree });
    expect(tree().data.value).toEqual(0);
    expect(tree().data.left?.value).toEqual(-5);
    expect(tree().data.right?.value).toEqual(3);
    expect(tree().data.right?.right?.value).toEqual(6);

    // 2. add -7
    //      0
    //    /   \
    //   -5    3
    //  /       \
    // -7        6

    act(() =>
      tree().setData({
        ...tree().data,
        left: { ...tree().data.left!, left: { value: -7 } },
      }),
    );
    expect(tree().data.value).toEqual(0);
    expect(tree().data.left?.value).toEqual(-5);
    expect(tree().data.left?.left?.value).toEqual(-7);
    expect(tree().data.right?.value).toEqual(3);
    expect(tree().data.right?.right?.value).toEqual(6);

    // 3. add 2
    //      0
    //    /   \
    //   -5    3
    //  /    /  \
    // -7   2    6

    act(() =>
      tree().setData({
        ...tree().data,
        right: { ...tree().data.right!, left: { value: 2 } },
      }),
    );
    expect(tree().data.value).toEqual(0);
    expect(tree().data.left?.value).toEqual(-5);
    expect(tree().data.left?.left?.value).toEqual(-7);
    expect(tree().data.right?.value).toEqual(3);
    expect(tree().data.right?.right?.value).toEqual(6);
    expect(tree().data.right?.left?.value).toEqual(2);

    // 3. update 6 -> 8
    //      0
    //    /   \
    //   -5    3
    //  /    /  \
    // -7   2    8

    act(() =>
      tree().setData({
        ...tree().data,
        right: { ...tree().data.right!, right: { value: 8 } },
      }),
    );
    expect(tree().data.value).toEqual(0);
    expect(tree().data.left?.value).toEqual(-5);
    expect(tree().data.left?.left?.value).toEqual(-7);
    expect(tree().data.right?.value).toEqual(3);
    expect(tree().data.right?.right?.value).toEqual(8);
    expect(tree().data.right?.left?.value).toEqual(2);

    // 4. delete -7
    //      0
    //    /   \
    //   -5    3
    //       /  \
    //      2    8

    act(() =>
      tree().setData({
        ...tree().data,
        left: { ...tree().data.left!, left: undefined },
      }),
    );
    expect(tree().data.value).toEqual(0);
    expect(tree().data.left?.value).toEqual(-5);
    expect(tree().data.left?.left).toEqual(undefined);
    expect(tree().data.right?.value).toEqual(3);
    expect(tree().data.right?.right?.value).toEqual(8);
    expect(tree().data.right?.left?.value).toEqual(2);
  });
});
