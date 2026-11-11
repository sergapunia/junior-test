import { BANDS } from '../risk.js'
import { cx } from '../format.js'

const TONE = {
  act: 'bg-act-soft text-act',
  watch: 'bg-watch-soft text-watch',
  steady: 'bg-steady-soft text-steady',
}

export function BandPill({ band }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', TONE[band])}>
      {BANDS[band].label}
    </span>
  )
}
