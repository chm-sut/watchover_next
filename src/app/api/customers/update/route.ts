import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    console.log('🚀 Starting customer map update via API...');
    
    const scriptPath = path.resolve('./scripts/update-customer-map.js');
    
    return new Promise<Response>((resolve) => {
      const childProcess = spawn('node', [scriptPath], {
        stdio: 'pipe',
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });

      childProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Customer map updated successfully',
            output: output.trim(),
            timestamp: new Date().toISOString()
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Customer map update failed',
            error: errorOutput.trim() || `Process exited with code ${code}`,
            output: output.trim(),
            timestamp: new Date().toISOString()
          }, { status: 500 }));
        }
      });

      childProcess.on('error', (error) => {
        resolve(NextResponse.json({
          success: false,
          message: 'Failed to start customer map update process',
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('❌ Customer map update API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Customer map update failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Customer map update endpoint',
    usage: 'POST to update customer map from recent JIRA tickets',
    timestamp: new Date().toISOString()
  });
}