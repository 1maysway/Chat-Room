export type MessageId = string;
export type Message = {
  text: string;
  type: number;
  sender_id: number;
  timestamp: string;
  id: MessageId;
  in_room_id: number;
  to_message_id: number | null;
};

export type ComplaintId = number;
export type Complaint = {
  id: ComplaintId;
  reason: number;
  description: string | null;
  creator_id: number;
  to_message_id: string | null;
  target_id: UserId;
  room_id: number;
  closed: boolean;
};

export type UserId = number;
export type User = {
  id:UserId;
  username: string;
  email: string|null;
  email_confirmed:boolean;
  status:number;
  country:string|null;
  city:string|null;
  language:string|null;
  age:number|null;
  role:number;
  avatar_url:string|null;
  gander:number|null;
}

export type RoomId = number;
export type Room = {
  id:RoomId;
  status:number;
}

export type Room_UserId = number;
export type Room_User = {
  id:Room_UserId;
  room_id:RoomId;
  user_id:UserId;
}

export type Room_Users_PreferenceId = number;
export type Room_Users_Preference = {
  id:Room_Users_PreferenceId;
  room_users_id:Room_UserId;
  country:string|null;
  city:string|null;
  language:string|null;
  age_from:number|null;
  age_to:number|null;
  gander:number|null;
}