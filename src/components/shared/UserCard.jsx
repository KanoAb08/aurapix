import { Link } from "react-router-dom";
import FollowButton from "./Follows";

const UserCard = ({currentUserId, targetUser}) => {
  
  return (
    <div className="user-card">

    <Link to={`/profile/${targetUser.$id}`} className="flex-center flex-col" >
      <img
        src={targetUser.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14"
      />

      <div className="flex-center flex-col gap-1">
        <p className="base-medium text-light-1 text-center line-clamp-1">
          {targetUser.name}
        </p>
        <p className="small-regular text-light-3 text-center line-clamp-1">
          @{targetUser.username}
        </p>
      </div>

    </Link>
      <FollowButton currentUserId={currentUserId} targetUserId={targetUser.$id} />
    </div>
  );
};

export default UserCard;
