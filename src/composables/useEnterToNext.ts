export function useEnterToNext() {
    function onKeydown(e: KeyboardEvent) {
        if (e.key !== 'Enter') return
        e.preventDefault()

        const form = (e.target as HTMLElement).closest('form')
        if (!form) return

        const focusable = Array.from(
            form.querySelectorAll<HTMLElement>(
                'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
            )
        )

        const index = focusable.indexOf(e.target as HTMLElement)
        if (index !== -1 && index + 1 < focusable.length) {
            focusable[index + 1].focus()
        }
    }

    return { onKeydown }
}
