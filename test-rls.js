import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email: 'test_migration@example.com',
    password: 'password123'
  });
  if (signUpError) console.error("Sign up error:", signUpError.message);
  
  const { data, error } = await supabase.from('categories').insert({ name: 'TestCatRLS' }).select();
  if (error) {
    console.error("Insert error:", error.message);
  } else {
    console.log("Insert success!");
  }
}
check();
