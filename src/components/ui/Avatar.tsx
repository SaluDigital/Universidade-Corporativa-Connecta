import { cn, getInitials } from '../../lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const colors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
];

function getColor(name: string) {
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ name, src, size = 'md', className, ring }: AvatarProps) {
  const color = getColor(name);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white',
        sizes[size],
        !src && `bg-gradient-to-br ${color}`,
        ring && 'ring-2 ring-violet-500/50 ring-offset-2 ring-offset-[#070711]',
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

interface AvatarGroupProps {
  users: { name: string; src?: string }[];
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} name={u.name} src={u.src} size={size} ring />
      ))}
      {remaining > 0 && (
        <div className={cn(
          'rounded-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-700 ring-2 ring-violet-500/50 ring-offset-2 ring-offset-[#070711] flex-shrink-0',
          size === 'sm' && 'w-8 h-8',
          size === 'md' && 'w-10 h-10',
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
