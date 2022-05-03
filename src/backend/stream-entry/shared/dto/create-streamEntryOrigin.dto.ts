import { StreamEntryOriginHealthEnum } from '..';

export class CreateStreamEntryOrigin {
  name: string;
  htmlUrl: string;
  fromFeedly: boolean;
  health: StreamEntryOriginHealthEnum;
}
