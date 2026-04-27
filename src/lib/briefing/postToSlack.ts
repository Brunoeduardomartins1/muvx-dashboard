import { WebClient } from '@slack/web-api'

interface PostBriefingArgs {
  text: string
  pdfBuffer: Buffer
  pdfFilename: string
  channel: string
  userToken: string
}

export interface PostBriefingResult {
  ok: boolean
  fileId?: string
  error?: string
}

/**
 * Posta o briefing no Slack com PDF anexo, em uma chamada via files.uploadV2.
 * O `initial_comment` aparece como mensagem do usuário com o arquivo anexado.
 * Como usamos USER token (xoxp), a mensagem aparece como sendo do próprio usuário.
 */
export async function postBriefingToSlack(args: PostBriefingArgs): Promise<PostBriefingResult> {
  const client = new WebClient(args.userToken)

  try {
    const result = await client.files.uploadV2({
      channel_id: args.channel,
      file: args.pdfBuffer,
      filename: args.pdfFilename,
      initial_comment: args.text,
      title: args.pdfFilename.replace(/\.pdf$/i, ''),
    })

    // uploadV2 retorna { ok, files: [{ id, ... }] } — extrai primeiro fileId
    const filesArr = (result as unknown as { files?: Array<{ id?: string }> }).files
    const fileId = filesArr?.[0]?.id

    return { ok: !!result.ok, fileId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Posta apenas uma mensagem de texto (usado em fallback de erro).
 */
export async function postPlainMessage(text: string, channel: string, userToken: string): Promise<boolean> {
  const client = new WebClient(userToken)
  try {
    const r = await client.chat.postMessage({ channel, text })
    return !!r.ok
  } catch {
    return false
  }
}
