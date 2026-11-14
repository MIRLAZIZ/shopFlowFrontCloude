import { UserData } from "@/interface/users.interface"


export const useUserData = () => {
    const userCookeUserData = useCookie<UserData | null>('userData')

    return {
        userCookeUserData,
    }
}
