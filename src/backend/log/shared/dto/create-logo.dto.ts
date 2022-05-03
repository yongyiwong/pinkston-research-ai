import { LogTypeEnum } from '..';
import * as moment from 'moment-timezone';

export class CreateLog {
  type: LogTypeEnum;
  data: string;
  time: Date;

  public static generalFactory(type: LogTypeEnum, data: string) {
    const item = new CreateLog();
    item.time = moment().toDate();
    item.type = type;
    item.data = data;

    return item;
  }
}
