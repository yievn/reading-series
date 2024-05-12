import { InjectionToken } from '@nestjs/common';

type CommonEdgeMetadata = {
  /**源模块 */
  sourceModuleName: string;
  /**目标模块 */
  targetModuleName: string;
};

type ModuleToModuleEdgeMetadata = {
  type: 'module-to-module';
} & CommonEdgeMetadata;

type ClassToClassEdgeMetadata = {
  type: 'class-to-class';
  /**源类名 */
  sourceClassName: string;
  /**目标类名 */
  targetClassName: string;
  /**源类 */
  sourceClassToken: InjectionToken;
  targetClassToken: InjectionToken;
  /**注入类型 */
  injectionType: 'constructor' | 'property' | 'decorator';
  keyOrIndex?: string | number | symbol;
  /**
   * If true, indicates that this edge represents an internal providers connection
   */
  internal?: boolean;
} & CommonEdgeMetadata;

export interface Edge {
  id: string;
  source: string;
  target: string;
  metadata: ModuleToModuleEdgeMetadata | ClassToClassEdgeMetadata;
}
