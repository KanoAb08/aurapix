import { z } from "zod"

export const SignupValidation = z.object({
  name: z.string().min(2, { message: 'Too short name.' }),
  username: z.string().min(2, { message: 'Too short username.' }),
  email: z.string().email(),
  password: z.string().min(8, { message: 'Password must be 8 characters.' })
})

export const SigninValidation = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: 'Password must be 8 characters.' })
})

const fileSchema = z.custom((files) => {
  if (!Array.isArray(files)) {
      return false;
  }
  for (const file of files) {
      if (!(file instanceof File)) {
          return false;
      }
  }
  return true;
}, {
  message: "Expected an array of files"
});
export const PostValidation = z.object({
  caption: z.string().min(5).max(2200),
  file: fileSchema,
  location: z.string().min(2).max(100),
  tags: z.string()
})

export const ProfileValidation = z.object({
  file: z.custom(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  bio: z.string(),
});