import { GraphInspector } from './graph-inspector';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
export const NoopGraphInspector: GraphInspector = new Proxy(
  GraphInspector.prototype,
  {
    // 调用GraphInspector.prototype上的方法都返回noop
    get: () => noop,
  },
);
