declare interface IOption {
  title?: string,
  message?: string,
  ico?: string,
  type?: number,
  showTime?: number
}

export default function (option?: IOption): Promise<void>;