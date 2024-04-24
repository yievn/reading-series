/**
 * System signals which shut down a process
 * 用于关闭进程的系统信号
 */
export enum ShutdownSignal {
  /**控制终端挂起或控制进程死亡。通常在终端关闭时发送给相关进程，用于通知他们终端的断开 */
  SIGHUP = 'SIGHUP',
  /**键盘中断。通常由用户在终端按下Ctrl+C发送，用于终端一个进程 */
  SIGINT = 'SIGINT',
  /**键盘退出。通常由用户在终端中按下Ctrl+\发送，用于请求退出一个进程，并生成核心转储 */
  SIGQUIT = 'SIGQUIT',
  /**
   *  非法指令。当进程尝试执行一个非法的指令时，系统发送此信号。
   */
  SIGILL = 'SIGILL',
  /**跟踪/断点陷阱。主要用于在调试过程中的断点或者异常跟踪。 */
  SIGTRAP = 'SIGTRAP',
  /**中止。通常由函数abort生成，用于异常中止程序。 */
  SIGABRT = 'SIGABRT',
  /**总线错误。当进程因为物理地址错误等原因发生总线错误时，系统发送此信号。 */
  SIGBUS = 'SIGBUS',
  /**浮点异常。但发生数学相关的异常，如除以零食，系统发送此信号。 */
  SIGFPE = 'SIGFPE',
  /**段错误。当进程尝试访问未分配给它的内存时，系统发送此信号。 */
  SIGSEGV = 'SIGSEGV',
  /**用于定义信号2.留给用户使用的自定义信号之一，具体用途由应用程序定义 */
  SIGUSR2 = 'SIGUSR2',
  /**终止信号。用于请求终止进程。相比SIGKILL，此信号可以被捕获和解释或忽略，允许进程正常或控制地终止 */
  SIGTERM = 'SIGTERM',
}
