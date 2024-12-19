import { Tables } from "@/types/database.types"
import { User } from "@supabase/supabase-js"

export interface LoggedInUser {
    profile: Tables<"profiles">
    user: User
}