/**
 * Icons shim (Phase 2): backed by phosphor-react.
 * Import icons exclusively from this module: `@/src/components/icons`.
 * Do not import from 'phosphor-react' or 'lucide-react' directly in app code.
 */

export * from 'phosphor-react';
export type { IconProps as LucideProps, IconProps } from 'phosphor-react';
export { IconContext } from 'phosphor-react';
export { Activity } from 'phosphor-react';

// --- Name mappings (lucide -> phosphor) to preserve existing imports ---
// Common icon names used across the codebase (1:1 or closest equivalents)
export { CaretRight as ChevronRight } from 'phosphor-react';
export { CaretLeft as ChevronLeft } from 'phosphor-react';
export { CaretDown as ChevronDown } from 'phosphor-react';
export { CaretUp as ChevronUp } from 'phosphor-react';
export { CaretRight as ChevronRightIcon } from 'phosphor-react';
export { CaretLeft as ChevronLeftIcon } from 'phosphor-react';
export { CaretDown as ChevronDownIcon } from 'phosphor-react';
export { CaretUp as ChevronUpIcon } from 'phosphor-react';

export { DotsThree as MoreHorizontal } from 'phosphor-react';
export { DotsThree as MoreHorizontalIcon } from 'phosphor-react';
export { DotsThreeVertical as MoreVertical } from 'phosphor-react';

export { X as XIcon } from 'phosphor-react';
export { Check as CheckIcon } from 'phosphor-react';
export { Minus as MinusIcon } from 'phosphor-react';
export { Circle as CircleIcon } from 'phosphor-react';
export { ArrowsClockwise as RefreshCw } from 'phosphor-react';
export { SpinnerGap as Loader2 } from 'phosphor-react';

export { MapPin } from 'phosphor-react';
export { MapPin as MapPinIcon } from 'phosphor-react';
export { CalendarBlank as Calendar } from 'phosphor-react';
export { CalendarBlank as CalendarIcon } from 'phosphor-react';
export { Users } from 'phosphor-react';
export { Users as UsersIcon } from 'phosphor-react';
export { Bell } from 'phosphor-react';
export { Bell as BellIcon } from 'phosphor-react';
export { Check } from 'phosphor-react';
export { Star } from 'phosphor-react';
export { Heart } from 'phosphor-react';
export { Plus } from 'phosphor-react';
export { Plus as PlusIcon } from 'phosphor-react';
export { PlusCircle } from 'phosphor-react';
export { Compass } from 'phosphor-react';
export { Coins } from 'phosphor-react';
export { Clock } from 'phosphor-react';
export { Clock as ClockIcon } from 'phosphor-react';
export { Target } from 'phosphor-react';
export { ArrowRight } from 'phosphor-react';
export { TrendUp as TrendingUp } from 'phosphor-react';
export { Sparkle as Sparkles } from 'phosphor-react';
export { House as Home } from 'phosphor-react';
export { Lightning as Zap } from 'phosphor-react';
export { Flame } from 'phosphor-react';

export { ChatCircle as MessageCircle } from 'phosphor-react';
export { ChatsTeardrop as MessageSquare } from 'phosphor-react';

export { Warning as AlertTriangle } from 'phosphor-react';
export { BookmarkSimple as Bookmark } from 'phosphor-react';
export { ShareNetwork as Share2 } from 'phosphor-react';
export { Funnel as Filter } from 'phosphor-react';
export { Trophy as Award } from 'phosphor-react';
export { Camera } from 'phosphor-react';
export { ThumbsUp } from 'phosphor-react';
export { Eye } from 'phosphor-react';
export { List as Menu } from 'phosphor-react';
export { MagnifyingGlass as Search } from 'phosphor-react';
export { MagnifyingGlass as SearchIcon } from 'phosphor-react';

// Aliases for UI/Settings screens
export { Gear as Settings } from 'phosphor-react';
export { Gear as SettingsIcon } from 'phosphor-react';
export { User } from 'phosphor-react';
export { User as UserIcon } from 'phosphor-react';
export { Globe } from 'phosphor-react';
export { SpeakerHigh as Volume2 } from 'phosphor-react';
export { SpeakerX as VolumeX } from 'phosphor-react';
export { ArrowSquareOut as ExternalLink } from 'phosphor-react';
export { DeviceMobile as Smartphone } from 'phosphor-react';
export { Question as HelpCircle } from 'phosphor-react';
export { Envelope as Mail } from 'phosphor-react';
export { Shield } from 'phosphor-react';
export { Palette } from 'phosphor-react';
export { Monitor } from 'phosphor-react';
export { Sun } from 'phosphor-react';
export { Moon } from 'phosphor-react';
export { DownloadSimple as Download } from 'phosphor-react';
export { UploadSimple as Upload } from 'phosphor-react';
export { TrashSimple as Trash2 } from 'phosphor-react';
export { PencilSimple as Edit3 } from 'phosphor-react';
export { Checks as CheckCheck } from 'phosphor-react';
export { Phone } from 'phosphor-react';
export { VideoCamera as Video } from 'phosphor-react';
export { Smiley as Smile } from 'phosphor-react';
export { Paperclip } from 'phosphor-react';
export { Image as ImageIcon } from 'phosphor-react';
export { CreditCard } from 'phosphor-react';
export { PaperPlaneRight as Send } from 'phosphor-react';
export { SignOut as LogOut } from 'phosphor-react';
export { SignIn as LogIn } from 'phosphor-react';
export { HouseSimple as HomeIcon } from 'phosphor-react';

// Additional lucide-like aliases for closer parity
export { ArrowLeft } from 'phosphor-react';
export { ArrowUp } from 'phosphor-react';
export { ArrowDown } from 'phosphor-react';
export { Info } from 'phosphor-react';
export { WarningCircle as AlertCircle } from 'phosphor-react';
export { XCircle } from 'phosphor-react';
export { CheckCircle } from 'phosphor-react';
export { Copy } from 'phosphor-react';
export { Tag } from 'phosphor-react';
export { Cloud } from 'phosphor-react';
export { EyeSlash as EyeOff } from 'phosphor-react';
export { StarHalf } from 'phosphor-react';

// Component-specific handle aliases
export { DotsSixVertical as GripVerticalIcon } from 'phosphor-react';
export { SidebarSimple as PanelLeftIcon } from 'phosphor-react';
