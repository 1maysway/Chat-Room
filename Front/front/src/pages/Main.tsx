import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectUser } from "../features/user/userSlice";

const Main: React.FC = () => {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  console.log(user);
  

  return <div>{user.info?.username}</div>;
};

export default Main;
