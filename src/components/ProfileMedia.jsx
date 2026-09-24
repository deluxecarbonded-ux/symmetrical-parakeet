import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitials } from "../lib/storage";
import { supabase } from "../lib/supabase";

function mediaUrl(profile) {
  if (!supabase) return null;
  const value =
    profile?.avatar_url || profile?.avatarUrl || profile?.avatar_path || profile?.avatarPath;
  if (!value || /^https?:\/\//i.test(value) || value.includes("..")) return null;
  const bucket = profile?.avatar_bucket || profile?.avatarBucket || "avatars";
  if (!/^(avatars|profile-media)$/i.test(bucket)) return null;
  const path = value.replace(/^\/+/, "");
  if (!path || !/^[A-Za-z0-9._/-]+$/.test(path)) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function isVideo(profile, source) {
  const type = profile?.avatar_media_type || profile?.avatarMediaType || "";
  return (
    type.startsWith("video/") ||
    /\.(mp4|m4v|mov|webm|ogv|3gp|3g2|mkv)$/i.test(source || "")
  );
}

export function ProfileAvatar({
  profile,
  size = "default",
  className = "",
  showSoundToggle = false,
  reduceMotion = false,
  label,
  videoLabel,
  muteLabel = "Mute avatar video",
  unmuteLabel = "Unmute avatar video",
}) {
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const rawSource = mediaUrl(profile);
  const source = failed ? null : rawSource;
  useEffect(() => setFailed(false), [rawSource]);
  const video = isVideo(profile, source);
  const username =
    profile?.username || profile?.displayName || profile?.display_name || "";
  const initials = username ? getInitials(username) : "?";
  const accessibleName = label || username || "Profile";
  const videoAccessibleName = videoLabel || accessibleName;

  return (
    <span
      className={`profile-avatar profile-avatar-${size} ${className}`}
      aria-label={accessibleName}
    >
      {source && video ? (
        <video
          src={source}
          muted={muted}
          autoPlay={!reduceMotion}
          loop={!reduceMotion}
          playsInline
          controls={reduceMotion && showSoundToggle}
          preload="metadata"
          aria-label={videoAccessibleName}
          onError={() => setFailed(true)}
        />
      ) : source ? (
        <img
          src={source}
          alt={accessibleName}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="profile-avatar-fallback">{initials}</span>
      )}
      {showSoundToggle && video && (
        <button
          type="button"
          className="profile-avatar-sound"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? unmuteLabel : muteLabel}
          title={muted ? unmuteLabel : muteLabel}
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      )}
    </span>
  );
}

export default ProfileAvatar;
