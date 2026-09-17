import { router } from '@/plugins/1.router'
import { getI18n } from '@/plugins/i18n'
import { ToastService } from '@/services/toast.service'
import { ofetch } from 'ofetch'

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,

  async onRequest({ options }) {
    if (!navigator.onLine) {
      ToastService.error(getI18n().global.t('network_error'))
      throw new Error('NO_INTERNET')
    }

    const accessToken = useCookie('accessToken').value
    if (accessToken) {
      options.headers = new Headers(options.headers as HeadersInit)
      options.headers.set('Authorization', `Bearer ${accessToken}`)
    }
  },

  // ✅ Server HTTP javob qaytarsa (404, 500, 503...)
  onResponseError({ response }) {
    const t = getI18n().global.t

    if (response.status === 401) router.push('/login')
    if (response.status === 503) ToastService.error(t('server_unavailable'))
    if (response.status >= 500) ToastService.error(t('server_error'))
  },

  // ✅ Server umuman javob bermasa (o'chiq, timeout, DNS xatosi)
  onRequestError({ error }) {
    if (error.message === 'NO_INTERNET') return

    const t = getI18n().global.t

    if (error.name === 'TimeoutError') {
      ToastService.error(t('request_timeout')) // Sekin yoki o'chiq server
    } else {
      ToastService.error(t('connection_error')) // DNS yoki boshqa
    }
  },
})
