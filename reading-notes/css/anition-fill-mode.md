

`animation-fill-mode` 是一个 CSS 属性，用于指定在动画执行之前和之后，动画元素的样式状态。它定义了动画在其生命周期的不同阶段（开始前、结束后）如何影响元素的样式。

### 属性值

`animation-fill-mode` 有四个可能的值：

1. **`none`** (默认值)
   - 动画不会影响元素在动画开始前和结束后的样式。
   - 元素在动画开始前和结束后将恢复到其原始样式。

2. **`forwards`**
   - 在动画结束后，元素将保持动画的最后一个关键帧的样式。
   - 适用于希望动画结束后元素保持最终状态的情况。

3. **`backwards`**
   - 在动画开始前，元素将应用动画的第一个关键帧的样式。
   - 适用于有动画延迟的情况，确保元素在延迟期间显示动画开始时的样式。

4. **`both`**
   - 结合 `forwards` 和 `backwards` 的效果。
   - 元素在动画开始前应用第一个关键帧的样式，并在动画结束后保持最后一个关键帧的样式。

### 使用示例

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.element {
  animation: slideIn 2s ease-in-out forwards;
}
```

在这个例子中：

- 动画 `slideIn` 将元素从左侧滑入。
- `animation-fill-mode: forwards;` 确保动画结束后，元素保持在 `translateX(0)` 的位置。

### 实际应用

- **`forwards`**：常用于需要动画结束后元素保持在动画结束状态的场景，比如一个按钮从透明变为不透明。
- **`backwards`**：用于有延迟的动画，确保在延迟期间元素显示动画开始时的样式。
- **`both`**：用于需要在动画开始前和结束后都应用关键帧样式的场景。

通过使用 `animation-fill-mode`，开发者可以更精确地控制动画对元素样式的影响，增强用户体验。