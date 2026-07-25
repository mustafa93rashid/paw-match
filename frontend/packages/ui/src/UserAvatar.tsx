import { useEffect, useState } from "react";
import { cn, getInitials, resolveProfileImageUrl } from "@paw-match/utilities";

export interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  profileImage?: unknown;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
};

export const UserAvatar = ({
  firstName,
  lastName,
  profileImage,
  size = "md",
  className,
}: UserAvatarProps) => {
  const imageUrl = resolveProfileImageUrl(profileImage);
  const [hasError, setHasError] = useState(false);

  // Give a freshly-uploaded/replaced image another chance to load.
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (imageUrl && !hasError) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setHasError(true)}
        className={cn("shrink-0 rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(firstName, lastName)}
    </span>
  );
};
