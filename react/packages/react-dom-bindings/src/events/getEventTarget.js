/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TEXT_NODE} from '../client/HTMLNodeType';

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 * 
 * 用于获取事件目标节点函数，它在处理浏览器事件时，帮助解决不同浏览器之间的兼容性问题。
 */
function getEventTarget(nativeEvent) {
  // Fallback to nativeEvent.srcElement for IE9
  // https://github.com/facebook/react/issues/12506
  /**
   * nativeEvent.target 是标准的 DOM 事件属性，表示事件的目标节点。
   * nativeEvent.srcElement 是早期版本的 Internet Explorer 使用的属性，与 target 类似。
   * 如果 target 和 srcElement 都不可用，默认使用 window 作为目标。
   */
  let target = nativeEvent.target || nativeEvent.srcElement || window;

  // Normalize SVG <use> element events #4963
  /**
   * 这个判断用于处理SVG中的<use>元素。在某些浏览器中，
   * 事件可能会触发在<use>元素上，而不是实际的目标元素
   */
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }

  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === TEXT_NODE ? target.parentNode : target;
}

export default getEventTarget;
