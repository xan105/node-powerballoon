declare interface ICallback{
  onActivated?(): void,
  onDismissed?(): void
}

declare interface IOption {
  title?: string,
  message?: string,
  ico?: string,
  type?: number,
  showTime?: number,
  callback?: ICallback
}

export default function (option?: IOption): Promise<void>;