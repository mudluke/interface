import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [WalletFilled, AnimatedWalletFilled] = createIcon({
  name: 'WalletFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M13.25 14C13.25 15.79 14.71 17.25 16.5 17.25H21V18C21 20 20 21 18 21H6C4 21 3 20 3 18V5C3 6.1 3.9 7 5 7H18C20 7 21 8 21 10V10.75H16.5C14.71 10.75 13.25 12.21 13.25 14ZM16.5 12.25C15.54 12.25 14.75 13.04 14.75 14C14.75 14.96 15.54 15.75 16.5 15.75H21V12.25H16.5ZM17.02 15C16.47 15 16.01 14.55 16.01 14C16.01 13.45 16.46 13 17.01 13H17.02C17.57 13 18.02 13.45 18.02 14C18.02 14.55 17.57 15 17.02 15ZM15 3H5.75C5.06 3 4.5 3.56 4.5 4.25C4.5 4.94 5.06 5.5 5.75 5.5H17.97C17.82 3.83 16.83 3 15 3Z"
        fill={props.style?.color}
      />
    </Svg>
  ),
})
