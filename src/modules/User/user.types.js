export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isEmailConfirmed: user.isEmailConfirmed,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
  };
}
