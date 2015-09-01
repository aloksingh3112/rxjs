import Operator from '../Operator';
import Observer from '../Observer';
import Subscriber from '../Subscriber';
import Scheduler from '../Scheduler';
import Subscription from '../Subscription';
import isDate from '../util/isDate';

export default function timeout(due: number|Date, errorToSend: any = null, scheduler: Scheduler = Scheduler.immediate) {
  let waitFor = isDate(due) ? (+due - Date.now()) : <number>due;
  return this.lift(new TimeoutOperator(waitFor, errorToSend, scheduler));
}

class TimeoutOperator<T, R> implements Operator<T, R> {
  constructor(private waitFor: number, private errorToSend: any, private scheduler: Scheduler) { 
  }
  
  call(observer: Observer<R>) {
    return new TimeoutSubscriber(observer, this.waitFor, this.errorToSend, this.scheduler);
  }
}

class TimeoutSubscriber<T> extends Subscriber<T> {
  timeoutSubscription: Subscription<any>;
  
  constructor(destination: Observer<T>, private waitFor: number, private errorToSend: any, private scheduler: Scheduler) {
    super(destination);
    let delay = waitFor;
    scheduler.schedule(delay, { subscriber: this }, dispatchTimeout);
  }
  
  sendTimeoutError() {
    this.error(this.errorToSend || new Error('timeout'));
  }
}

function dispatchTimeout<T>(state: { subscriber: TimeoutSubscriber<T> }) {
  const subscriber = state.subscriber;
  subscriber.sendTimeoutError();
}