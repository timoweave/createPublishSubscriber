import { describe, test, expect } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { v4 as uuid } from "uuid";

import {
  PublishSubscriber,
  createPublishSubscriber,
} from "../createPublishSubscriber";

describe("single key/value", () => {
  test("string case", () => {
    interface Name {
      name: string;
    }
    const { useSub, PubProvider: wrapper } = createPublishSubscriber<Name>({
      name: "",
    });
    const rendered = renderHook(() => useSub((s) => s.name), { wrapper });
    const name = (): PublishSubscriber<Name, string> => rendered.result.current;

    expect(name().data).toEqual("");

    act(() => name().setData({ name: "peter pan" }));
    expect(name().data).toEqual("peter pan");
  });

  test("boolean case", () => {
    interface Flag {
      flag: boolean;
    }
    const { useSub, PubProvider: wrapper } = createPublishSubscriber<Flag>({
      flag: false,
    });
    const rendered = renderHook(() => useSub((s) => s.flag), { wrapper });
    const flag = (): PublishSubscriber<Flag, boolean> =>
      rendered.result.current;

    expect(flag().data).toEqual(false);

    act(() => flag().setData({ flag: true }));
    expect(flag().data).toEqual(true);
  });

  test("number case", () => {
    interface Quantity {
      quantity: number;
    }
    const { useSub, PubProvider: wrapper } = createPublishSubscriber<Quantity>({
      quantity: 0,
    });
    const rendered = renderHook(() => useSub((s) => s.quantity), { wrapper });
    const quantity = (): PublishSubscriber<Quantity, number> =>
      rendered.result.current;

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

    const appendNumber = (
      num: number,
      state: () => PublishSubscriber<Numbers, number[]>,
    ): void => {
      const { data, setData } = state();
      const numbers = [...data, num];
      setData({ numbers });
    };

    const removeNumber = (
      index: number,
      state: () => PublishSubscriber<Numbers, number[]>,
    ): void => {
      const { data, setData } = state();
      const numbers = data.filter((_, i) => i !== index);
      setData({ numbers });
    };

    const { useSub, PubProvider: wrapper } = createPublishSubscriber<Numbers>({
      numbers: [],
    });
    const rendered = renderHook(() => useSub((s) => s.numbers), { wrapper });
    const numbers = (): PublishSubscriber<Numbers, number[]> =>
      rendered.result.current;

    expect(numbers().data).toEqual([]);

    act(() => appendNumber(10, numbers));
    expect(numbers().data).toEqual([10]);

    act(() => appendNumber(20, numbers));
    expect(numbers().data).toEqual([10, 20]);

    act(() => appendNumber(-3, numbers));
    expect(numbers().data).toEqual([10, 20, -3]);

    act(() => removeNumber(0, numbers));
    act(() => removeNumber(0, numbers));
    act(() => appendNumber(3, numbers));
    expect(numbers().data).toEqual([-3, 3]);
  });

  test("lookup case", () => {
    type Lookup = Record<string, number>;

    const getLookup = (
      key: string,
      state: () => PublishSubscriber<Lookup>,
    ): number => {
      return state().data[key];
    };

    const setLookup = (
      key: string,
      delta: number,
      state: () => PublishSubscriber<Lookup>,
    ): void => {
      state().setData({ [key]: delta });
    };

    const incrementLookup = (
      key: string,
      delta: number,
      state: () => PublishSubscriber<Lookup>,
    ): void => {
      const data = state().data[key];
      state().setData({ [key]: data + delta });
    };

    const { useSub, PubProvider: wrapper } = createPublishSubscriber<Lookup>(
      {},
    );
    const renderedAll = renderHook(() => useSub((s) => s), { wrapper });
    const lookup = (): PublishSubscriber<Lookup> => renderedAll.result.current;

    expect(lookup().data).toEqual({});

    act(() => setLookup("peter_pan", 10, lookup));
    expect(getLookup("peter_pan", lookup)).toEqual(10);

    act(() => setLookup("tinker_bell", 20, lookup));
    expect(getLookup("peter_pan", lookup)).toEqual(10);
    expect(getLookup("tinker_bell", lookup)).toEqual(20);

    act(() => setLookup("tiger_lily", -3, lookup));
    expect(getLookup("peter_pan", lookup)).toEqual(10);
    expect(getLookup("tinker_bell", lookup)).toEqual(20);
    expect(getLookup("tiger_lily", lookup)).toEqual(-3);

    act(() => incrementLookup("tiger_lily", -5, lookup));
    expect(getLookup("tiger_lily", lookup)).toEqual(-8);

    act(() => incrementLookup("peter_pan", -5, lookup));
    expect(getLookup("peter_pan", lookup)).toEqual(5);

    act(() => incrementLookup("tinker_bell", -5, lookup));
    expect(getLookup("tinker_bell", lookup)).toEqual(15);
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
    const { useSub, PubProvider: wrapper } =
      createPublishSubscriber<Address>(hack);
    const rendered = renderHook(() => useSub((s) => s), { wrapper });
    const address = (): PublishSubscriber<Address> => rendered.result.current;
    expect(address().data).toEqual({ ...hack });

    act(() => address().setData({ street2: "PO Box 123" }));
    expect(address().data.street2).toEqual("PO Box 123");
    expect(address().data).toEqual({ ...hack, street2: "PO Box 123" });
  });

  test("street1 address case", () => {
    const { useSub, PubProvider: wrapper } =
      createPublishSubscriber<Address>(hack);
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

    const { useSub, PubProvider: wrapper } =
      createPublishSubscriber<Node>(initTree);
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

describe("todo list", () => {
  interface TodoItem {
    id?: string;
    title: string;
    done: boolean;
  }

  interface TodoStore {
    todoList: TodoItem[];
  }

  const appendTodo = (
    title: string,
    todoStore: PublishSubscriber<TodoStore>,
  ): void => {
    const todoItem = { title, id: uuid(), done: false };
    const { data, setData } = todoStore;
    const todoList = [...data.todoList, todoItem];
    setData({ todoList });
  };

  const removeTodo = (
    id: string,
    todoState: PublishSubscriber<TodoStore>,
  ): void => {
    const { data, setData } = todoState;
    const todoList = data.todoList.filter((todo) => todo.id !== id);
    setData({ todoList });
  };

  const toggleTodo = (
    id: string,
    todoState: PublishSubscriber<TodoStore>,
  ): void => {
    const { data, setData } = todoState;
    const todoList = data.todoList.map((todo) =>
      todo.id !== id ? todo : { ...todo, done: !todo.done },
    );
    setData({ todoList });
  };

  test("todo list, add, toggle, delete", () => {
    const todoStore = createPublishSubscriber<TodoStore>({ todoList: [] });
    const { useSub, PubProvider: wrapper } = todoStore;
    const rendered = renderHook(() => useSub((s) => s), { wrapper });
    const todo = (): PublishSubscriber<TodoStore> => rendered.result.current;

    expect(todo().data.todoList).toHaveLength(0);

    act(() => appendTodo("say hello", todo()));
    expect(todo().data.todoList[0]).toMatchObject({
      title: "say hello",
      done: false,
    });

    act(() => appendTodo("read user manual", todo()));
    expect(todo().data.todoList[1]).toMatchObject({
      title: "read user manual",
      done: false,
    });

    act(() => toggleTodo(todo().data.todoList[0].id ?? "", todo()));
    expect(todo().data.todoList[0]).toMatchObject({
      title: "say hello",
      done: true,
    });

    expect(todo().data.todoList).toHaveLength(2);

    act(() => removeTodo(todo().data.todoList[0].id ?? "", todo()));
    expect(todo().data.todoList[0]).toMatchObject({
      title: "read user manual",
      done: false,
    });

    expect(todo().data.todoList).toHaveLength(1);
    expect(todo().data.todoList[0]).toMatchObject({
      title: "read user manual",
      done: false,
    });

    act(() => toggleTodo(todo().data.todoList[0].id ?? "", todo()));
    expect(todo().data.todoList[0]).toMatchObject({
      title: "read user manual",
      done: true,
    });
  });
});
