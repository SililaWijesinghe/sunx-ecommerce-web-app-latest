import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const passwords = ['password123', 'password', '123456', '12345678', 'admin123'];
  for (const p of passwords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'premierdigitalsales@gmail.com',
      password: p
    });
    if (!error) {
      console.log("Auth success with:", p);
      return;
    }
  }
  console.log("None worked");
}
check();
