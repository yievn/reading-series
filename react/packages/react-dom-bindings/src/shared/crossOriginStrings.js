/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export opaque type CrossOriginString: string = string;

/**
 * 用于处理跨域请求的属性值。该函数检查输入是否为字符串，
 * 并且是否等于 'use-credentials'。如果是，则返回该字符串；
 * 否则返回空字符串。如果输入不是字符串，则返回 undefined。
 */
export function getCrossOriginString(input: ?string): ?CrossOriginString {
  if (typeof input === 'string') {
    return input === 'use-credentials' ? input : '';
  }
  return undefined;
}

/**
 * 类似于 getCrossOriginString，但增加了对 as 参数的检查。
 * 如果 as 为 'font'，则直接返回空字符串。
 * 这可能用于特定的资源类型（如字体）需要不同的跨域策略。
 */
export function getCrossOriginStringAs(
  as: ?string,
  input: ?string,
): ?CrossOriginString {
  if (as === 'font') {
    return '';
  }
  if (typeof input === 'string') {
    return input === 'use-credentials' ? input : '';
  }
  return undefined;
}
