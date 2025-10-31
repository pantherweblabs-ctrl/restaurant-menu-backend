// Test Supabase connection with placeholder keys
const { createClient } = require('@supabase/supabase-js');

// Using placeholder keys for testing
const supabaseUrl = 'https://yjynnclmzueqxitqszdt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeW5uY2xtenVlcXhpdHFzenpkdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NzQ4MDAwLCJleHAiOjIwNTAzMjQwMDB9.placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    // Try to fetch visitors
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Supabase error:', error.message);
      console.log('💡 This is expected with placeholder keys');
      console.log('📋 To get real keys:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to Settings > API');
      console.log('4. Copy the anon/public key and service_role key');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSupabase();
