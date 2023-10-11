# Introduction

1. setup as easy as hook/context
1. render as little as redux/recoil

Inspired by Jack Herrington's blasting fast react context video.
https://www.youtube.com/watch?v=ZKlXqrcBx88. Thank you Jack!

Use both `useSyncExternalStore` and `useRef` to share states in context/provider between react components,instead of `useState`, to just re-render only component that subscribes to a subset state that is published (or changed).

# Example 1: Address Form
```ts
// address.ts
import {
  PublishSubscriber,
  createPublishSubscriber,
} from "create-publish-subscriber";

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
```

```ts
import {
  PublishSubscriber,
  createPublishSubscriber,
} from "../create-publish-subscriber";
import {Address} from './address';

test("only subscribe to street1 from the createPublishSubscriber<Address>", () => {
  const { useSub, PubProvider } = createPublishSubscriber<Address>(hack);
  const options = { wrapper: PubProvider }
  const useStreet1: PublishSubscriber<Address, string> = 
    () => useSub((s) => s.street1);
  const rendered = renderHook(() => useStreet1(), options);
  
  const street1 = () => rendered.result.current;
  expect(street1().data).toEqual(hack.street1);

  act(() => street1().setData({ street2: "PO Box 123" }));
  expect(street1().data).toEqual(hack.street1);
});

test("subscribe to address.* from the createPublishSubscriber<Address>", () => {
  const { useSub, PubProvider } = createPublishSubscriber<Address>(hack);
  const options = { wrapper: PubProvider }
  const rendered = renderHook(() => useSub((s) => s), options);
  
  const address: PublishSubscriber<Address>  = 
    () => rendered.result.current;
  expect(address().data).toEqual({ ...hack });

  act(() => address().setData({ street2: "PO Box 123" }));
  expect(address().data.street2).toEqual("PO Box 123");
  expect(address().data).toEqual({ ...hack, street2: "PO Box 123" });
});

```

# Example 2: Todo List
```ts
// todo.ts
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
```

```ts
// todo.test.ts
import {
  PublishSubscriber,
  createPublishSubscriber,
} from "../create-publish-subscriber";
import {TodoStore} from './todo';

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
```