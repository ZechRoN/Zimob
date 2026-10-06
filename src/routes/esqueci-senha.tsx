import {createFileRoute} from '@tanstack/react-router'
import {PasswordForm} from '@/components/password-form'
export const Route=createFileRoute('/esqueci-senha')({component:()=> <PasswordForm recovery />})
