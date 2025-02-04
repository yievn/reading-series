import {
  ref,
  watch,
  computed,
  onActivated,
  onMounted,
  defineComponent,
  nextTick,
  type ExtractPropTypes,
} from 'vue';

// Utils
import {
  makeNumericProp,
  makeStringProp,
  createNamespace,
  windowWidth,
} from '../utils';

import { useExpose } from '../composables/use-expose';

const [name, bem] = createNamespace('text-ellipsis');

export const textEllipsisProps = {
  rows: makeNumericProp(1),
  dots: makeStringProp('...'),
  content: makeStringProp(''),
  expandText: makeStringProp(''),
  collapseText: makeStringProp(''),
  position: makeStringProp('end'),
};

export type TextEllipsisProps = ExtractPropTypes<typeof textEllipsisProps>;

export default defineComponent({
  name,

  props: textEllipsisProps,

  emits: ['clickAction'],

  setup(props, { emit, slots }) {
    // 文本内容
    const text = ref(props.content);
    // 是否展开
    const expanded = ref(false);
    // 是否有操作按钮
    const hasAction = ref(false);
    // 根元素
    const root = ref<HTMLElement>();
    // 操作按钮元素
    const actionRef = ref<HTMLElement>();
    // 是否需要重新计算
    let needRecalculate = false;
    // 操作按钮文本
    const actionText = computed(() =>
      expanded.value ? props.collapseText : props.expandText,
    );
    // 将 px 转换为数字
    const pxToNum = (value: string | null) => {
      if (!value) return 0;
      const match = value.match(/^\d*(\.\d*)?/);
      return match ? Number(match[0]) : 0;
    };
    // 克隆容器
    const cloneContainer = () => {
      // 没有容器
      if (!root.value || !root.value.isConnected) return;
      // 获取原容器的所有计算样式
      const originStyle = window.getComputedStyle(root.value);
      // 创建一个新的容器
      const container = document.createElement('div');
      // 获取原容器所有的样式属性名
      const styleNames: string[] = Array.prototype.slice.apply(originStyle);
      // 遍历所有样式属性名，将在root上的样式也设置到新容器上
      styleNames.forEach((name) => {
        container.style.setProperty(name, originStyle.getPropertyValue(name));
      });

      // 通过将position设置为fixed病将top设置为一个很大的赋值，容器被放置在视口之外
      container.style.position = 'fixed';
      container.style.zIndex = '-9999';
      container.style.top = '-9999px';
      // 这些设置确保容器的高度是自动计算的，以便能够正确测量文本内容的高度
      container.style.height = 'auto';
      container.style.minHeight = 'auto';
      container.style.maxHeight = 'auto';

      container.innerText = props.content;
      document.body.appendChild(container);

      return container;
    };

    // 计算省略文本
    const calcEllipsisText = (container: HTMLDivElement, maxHeight: number) => {
      const { content, position, dots } = props;
      const end = content.length;
      const middle = (0 + end) >> 1;
      const actionHTML = slots.action
        ? actionRef.value?.outerHTML ?? ''
        : props.expandText;

      const calcEllipse = () => {
        // calculate the former or later content
        const tail = (left: number, right: number): string => {
          if (right - left <= 1) {
            if (position === 'end') {
              return content.slice(0, left) + dots;
            }
            return dots + content.slice(right, end);
          }

          const middle = Math.round((left + right) / 2);

          // Set the interception location
          if (position === 'end') {
            container.innerText = content.slice(0, middle) + dots;
          } else {
            container.innerText = dots + content.slice(middle, end);
          }

          container.innerHTML += actionHTML;

          // The height after interception still does not match the rquired height
          if (container.offsetHeight > maxHeight) {
            if (position === 'end') {
              return tail(left, middle);
            }
            return tail(middle, right);
          }

          if (position === 'end') {
            return tail(middle, right);
          }

          return tail(left, middle);
        };

        return tail(0, end);
      };

      const middleTail = (
        leftPart: [number, number],
        rightPart: [number, number],
      ): string => {
        if (
          leftPart[1] - leftPart[0] <= 1 &&
          rightPart[1] - rightPart[0] <= 1
        ) {
          return (
            content.slice(0, leftPart[0]) +
            dots +
            content.slice(rightPart[1], end)
          );
        }

        const leftMiddle = Math.floor((leftPart[0] + leftPart[1]) / 2);
        const rightMiddle = Math.ceil((rightPart[0] + rightPart[1]) / 2);

        container.innerText =
          props.content.slice(0, leftMiddle) +
          props.dots +
          props.content.slice(rightMiddle, end);
        container.innerHTML += actionHTML;

        if (container.offsetHeight >= maxHeight) {
          return middleTail(
            [leftPart[0], leftMiddle],
            [rightMiddle, rightPart[1]],
          );
        }

        return middleTail(
          [leftMiddle, leftPart[1]],
          [rightPart[0], rightMiddle],
        );
      };

      return props.position === 'middle'
        ? middleTail([0, middle], [middle, end])
        : calcEllipse();
    };

    const calcEllipsised = () => {
      // Calculate the interceptional text
      const container = cloneContainer();

      if (!container) {
        needRecalculate = true;
        return;
      }

      const { paddingBottom, paddingTop, lineHeight } = container.style;
      const maxHeight = Math.ceil(
        (Number(props.rows) + 0.5) * pxToNum(lineHeight) +
          pxToNum(paddingTop) +
          pxToNum(paddingBottom),
      );

      if (maxHeight < container.offsetHeight) {
        hasAction.value = true;
        text.value = calcEllipsisText(container, maxHeight);
      } else {
        hasAction.value = false;
        text.value = props.content;
      }

      document.body.removeChild(container);
    };

    const toggle = (isExpanded = !expanded.value) => {
      expanded.value = isExpanded;
    };

    const onClickAction = (event: MouseEvent) => {
      toggle();
      emit('clickAction', event);
    };

    const renderAction = () => {
      const action = slots.action
        ? slots.action({ expanded: expanded.value })
        : actionText.value;
      return (
        <span ref={actionRef} class={bem('action')} onClick={onClickAction}>
          {action}
        </span>
      );
    };

    onMounted(() => {
      calcEllipsised();

      if (slots.action) {
        nextTick(calcEllipsised);
      }
    });

    onActivated(() => {
      if (needRecalculate) {
        needRecalculate = false;
        calcEllipsised();
      }
    });

    watch(
      [windowWidth, () => [props.content, props.rows, props.position]],
      calcEllipsised,
    );

    useExpose({ toggle });

    return () => (
      <div ref={root} class={bem()}>
        {expanded.value ? props.content : text.value}
        {hasAction.value ? renderAction() : null}
      </div>
    );
  },
});
