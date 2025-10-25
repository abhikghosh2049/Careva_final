import React from 'react';

function UserProfile({ userName }) {
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <div className="user-profile">
      <div className="user-avatar">{getInitials(userName)}</div>
      <span className="user-name">{userName}</span>
    </div>
  );
}

export default UserProfile;