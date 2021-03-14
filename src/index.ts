import sleep from '@stater/sleep';

export type RepeatedAction = (runTime: number) => void | Promise<void>;

/**
 * A simple promise based function repeater.
 * @example
 * ```typescript
 * // Repeat console log 10 times.
 * repeat(console.log).repeat(10);
 *
 * // Repeat the maintenance checker until the maintenance is finished, and add delay 1000ms for each call.
 * let finished = false;
 * await repeat(async (rt) => {
 *   console.log(`[Retries: ${rt}] Checking maintenance state...`);
 *   finished = await server.maintenanceFinished();
 * }).every('1s').until(() => finished);
 * console.log('Maintenance is finished!');
 * ```
 */
export class Repeater {
  public status: 'idle' | 'running' | 'complete' = 'idle';
  public startDate: Date;
  public endDate: Date;
  public runTime: number;

  private _repeated = 0;
  private _timeout: number;
  private _stopped: boolean;

  /**
   * @param action - Function to be repeated.
   */
  constructor(private action: RepeatedAction) {}

  /**
   * Private function to run the action.
   * @private
   */
  private async _doAction(): Promise<void> {
    this._repeated += 1;

    if (this._timeout) {
      await sleep(this._timeout);
    }

    await this.action(this._repeated);
  }

  /**
   * Private function to mark the repeater as completed.
   * @private
   */
  private _complete(): this {
    this._repeated = 0;
    this.status = 'complete';
    this.endDate = new Date();
    this.runTime = (this.endDate.getTime() - this.startDate.getTime());

    return this;
  }

  /**
   * Add a timeout for each action call. This method must be called before calling the until() or repeat() method.
   * @param time - Delay time in `ms` (milliseconds), `s` (seconds), or `m` (minutes).
   * @example
   * ```typescript
   * await repeat(console.log).every('5s').repeat(10);
   * ```
   */
  public every(time: string): this;
  /**
   * @param ms - Delay time in milliseconds.
   * @example
   * ```typescript
   * await repeat(console.log).every(5000).repeat(10);
   * ```
   */
  public every(ms: number): this;
  public every(ms: string | number): this {
    if (typeof ms === 'string') {
      if (ms.endsWith('ms')) {
        this._timeout = parseInt(ms);
      } else if (ms.endsWith('s')) {
        this._timeout = parseInt(ms) * 1000;
      } else if (ms.endsWith('m')) {
        this._timeout = parseInt(ms) * 1000 * 60;
      }
    } else if (typeof ms === 'number') {
      this._timeout = ms;
    }
    return this;
  }

  /**
   * Call the action and stop until the given function returns true.
   * @param finished - Function to check does the repeater should be finished.
   * @example
   * ```typescript
   * let finished = false;
   * await repeat((rt) => {
   *   if (rt >= 10) {
   *     finished = true;
   *   }
   * }).until(() => finished);
   * ```
   */
  public async until(finished: () => boolean): Promise<this> {
    this.status = 'running';
    this.startDate = new Date();

    const run = async () => {
      await this._doAction();

      if (typeof finished === 'function') {
        if (!finished()) {
          await run();
        }
      } else {
        if (!finished) {
          await run();
        }
      }
    }

    await run();
    return this._complete();
  }

  /**
   * Call the action and repeat it for the given count.
   * @param count - Number of how many times the action should be repeated.
   * @example
   * ```typescript
   * await repeat(console.log).repeat(10);
   * ```
   */
  public async repeat(count: number): Promise<this> {
    this.status = 'running';
    this.startDate = new Date();

    const run = async () => {
      await this._doAction();

      count -= 1;
      if (count) {
        await run();
      }
    }

    await run();
    return this._complete();
  }

  /**
   * Call the action for an infinite times until we manually stop it.
   * @example
   * ```typescript
   * const r = repeat(() => {
   *   console.log(new Date().toISOString());
   * }).every('1s').infinite();
   *
   * // Stop the repeater after one minute.
   * setTimeout(() => r.stop(), 60000);
   * ```
   */
  public infinite(): this {
    this.status = 'running';
    this.startDate = new Date();

    const run = async () => {
      this._repeated += 1;

      if (this._timeout) {
        await sleep(this._timeout);
      }

      if (!this._stopped) {
        await this.action(this._repeated);
        await run();
      }
    }

    run().then(() => {});
    return this;
  }

  /**
   * Stop the infinity call.
   */
  public stop(): this {
    this._stopped = true;
    this._complete();
    return this;
  }
}

/**
 * Repeat an action until a condition satisfied.
 * @param action - Function to be repeated.
 * @example
 * ```typescript
 * // Repeat console log 10 times.
 * await repeat(console.log).repeat(10);
 *
 * // Repeat the maintenance checker until the maintenance is finished, and add delay 1000ms for each call.
 * let finished = false;
 * await repeat(async (rt) => {
 *   console.log(`[Retries: ${rt}] Checking maintenance state...`);
 *   finished = await server.maintenanceFinished();
 * }).every(1000).until(() => finished);
 * console.log('Maintenance is finished!');
 * ```
 */
export function repeat(action: RepeatedAction): Repeater {
  return new Repeater(action);
}
