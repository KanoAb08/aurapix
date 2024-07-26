import { useEffect, useState } from 'react';
import { useFollowUser, useGetFollowingStatus, useUnfollowUser } from '@/lib/react-query/queriesAndMutations';
import { Button } from '../ui/button';
import Loader from './Loader';

const FollowButton = ({currentUserId, targetUserId}) => {

  const [isFollowing, setIsFollowing] = useState(false);
  const {data: followingStatus} = useGetFollowingStatus({currentUserId, targetUserId})
  const {mutateAsync: followMutation} = useFollowUser();
  const {mutateAsync: unfollowMutation} = useUnfollowUser();

  useEffect(() => {
    if (followingStatus !== undefined) {
      setIsFollowing(followingStatus);
    }
  }, [followingStatus]);

  const handleFollow = () => {
    followMutation({ followerId: currentUserId, followingId: targetUserId }, {
      onSuccess: () => {
        setIsFollowing(true);
      }
    });
  };

  const handleUnfollow = () => {
    unfollowMutation({ followerId: currentUserId, followingId: targetUserId }, {
      onSuccess: () => {
        setIsFollowing(false);
      }
    });
  };

  if (followingStatus == undefined) return <Loader />

  const isDisabled = currentUserId === targetUserId;

  return (
    <Button 
      onClick={isDisabled ? undefined : (isFollowing ? handleUnfollow : handleFollow)} 
      className="shad-button_primary px-8" 
      disabled={isDisabled}
    >
      {isDisabled ? 'Nope, it\'s you' : (isFollowing ? 'Unfollow' : 'Follow')}
    </Button>
  );
};

export default FollowButton;
