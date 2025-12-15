import { Asset, Information } from 'freeustaxes/core/data'
import { Either, run } from 'freeustaxes/core/util'
import F1040 from './F1040'
import Form from 'freeustaxes/core/irsForms/Form'
import { F1040Error } from 'freeustaxes/forms/errors'
import { validate } from 'freeustaxes/forms/F1040Base'

export const create1040 = (
  info: Information,
  assets: Asset<Date>[]
): Either<F1040Error[], [F1040, Form[]]> =>
  run(validate(info))
    .map<[F1040, Form[]]>((info) => {
      const f1040 = new F1040(info, assets)
      return [f1040, f1040.schedules()]
    })
    .value()
