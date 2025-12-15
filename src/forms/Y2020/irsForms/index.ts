import { PDFDocument } from 'pdf-lib'
import { create1040 } from '../irsForms/Main'
import { Either, isLeft, isRight, right } from 'freeustaxes/core/util'
import log from 'freeustaxes/core/log'
import { combinePdfs, PDFDownloader } from 'freeustaxes/core/pdfFiller/pdfHandler'
import { Information, Asset } from 'freeustaxes/core/data'
import { F1040Error } from 'freeustaxes/forms/errors'
import { insertFormDataToPdfs } from 'freeustaxes/core/irsForms'

export { create1040 }

export const create1040PDFs =
  (state: Information, assets: Asset<Date>[]) =>
  async (
    downloader: PDFDownloader
  ): Promise<Either<F1040Error[], PDFDocument[]>> => {
    if (state.taxPayer.primaryPerson !== undefined) {
      const f1040Result = create1040(state, assets)
      // Get data and pdf links applicable to the model state
      if (isLeft(f1040Result)) {
        throw new Error(f1040Result.left.join('\n'))
      }

      const [, forms] = f1040Result.right

      const inserted = await insertFormDataToPdfs(forms, downloader)

      return right(inserted)
    }

    log.error('Attempt to create pdf with no data, will be empty')
    return right([])
  }

export const create1040PDF =
  (state: Information, assets: Asset<Date>[]) =>
  async (
    downloader: PDFDownloader
  ): Promise<Either<F1040Error[], Uint8Array>> => {
    const pdfResult = await create1040PDFs(state, assets)(downloader)

    if (isRight(pdfResult)) {
      const pdf = await combinePdfs(pdfResult.right)
      const bytes = await pdf.save()
      return right(bytes)
    }

    throw new Error(pdfResult.left.join('\n'))
  }
