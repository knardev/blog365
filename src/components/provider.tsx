"use client";

import { ReactNode, useEffect } from "react";
import { RecoilRoot, useSetRecoilState } from "recoil";
import { loggedInUserAtom } from "@/recoil/atom";
import { LoggedInUser } from "@/features/common/types/types";

// A component that sets the profileId in the Recoil state when mounted
function InitializeProfileId({ loggedInUser }: { loggedInUser: LoggedInUser }) {
  const setLoggedInUser = useSetRecoilState(loggedInUserAtom);
  useEffect(() => {
    setLoggedInUser(loggedInUser);
  }, [loggedInUser, setLoggedInUser]);

  return null;
}

interface ProvidersProps {
  children: ReactNode;
  loggedInUser?: LoggedInUser; // profileId를 선택적으로 받도록 처리
}

export function Providers({ children, loggedInUser }: ProvidersProps) {
  return (
    <RecoilRoot>
      {/* profileId가 있을 경우에만 초기화 컴포넌트를 렌더 */}
      {loggedInUser && <InitializeProfileId loggedInUser={loggedInUser} />}
      {children}
    </RecoilRoot>
  );
}
