import { useState } from "react";

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button
      className="blume-badge blume-badge--accent"
      onClick={() => setCount(count + 1)}
      type="button"
    >
      Clicked {count} times
    </button>
  );
};

export default Counter;
