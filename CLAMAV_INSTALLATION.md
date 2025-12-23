# ClamAV Installation on EC2 (Amazon Linux 2023)

## Installation Steps

```bash
# 1. Install ClamAV packages
sudo dnf install -y clamav clamd clamav-update

# 2. Create necessary directories
sudo mkdir -p /var/run/clamd.scan
sudo chown clamscan:clamscan /var/run/clamd.scan

# 3. Configure ClamAV
sudo tee /etc/clamd.d/scan.conf > /dev/null <<'EOF'
LogFile /var/log/clamd.scan
LogFileMaxSize 2M
LogTime yes
LogSyslog yes
PidFile /var/run/clamd.scan/clamd.pid
TemporaryDirectory /var/tmp
DatabaseDirectory /var/lib/clamav
LocalSocket /var/run/clamd.scan/clamd.sock
LocalSocketGroup clamscan
LocalSocketMode 666
FixStaleSocket yes
TCPSocket 3310
TCPAddr 127.0.0.1
MaxConnectionQueueLength 15
MaxThreads 12
ReadTimeout 300
CommandReadTimeout 300
SendBufTimeout 200
MaxQueue 100
IdleTimeout 30
ExcludePath ^/proc/
ExcludePath ^/sys/
ScanPE yes
ScanELF yes
ScanMail yes
ScanArchive yes
ArchiveBlockEncrypted no
MaxDirectoryRecursion 15
FollowDirectorySymlinks no
FollowFileSymlinks no
MaxFileSize 2000M
MaxScanSize 2000M
MaxFiles 10000
MaxRecursion 16
MaxEmbeddedPE 10M
MaxHTMLNormalize 10M
MaxHTMLNoTags 2M
MaxScriptNormalize 5M
MaxZipTypeRcg 1M
EOF

# 4. Update virus definitions
sudo freshclam

# 5. Start ClamAV daemon
sudo systemctl enable clamd@scan
sudo systemctl start clamd@scan

# 6. Verify ClamAV is running
sudo systemctl status clamd@scan

# 7. Test socket connection
echo "PING" | nc -U /var/run/clamd.scan/clamd.sock
# Should return: PONG

# 8. Create uploads directory for file processing
sudo mkdir -p /tmp/uploads
sudo chmod 777 /tmp/uploads

# 9. Test virus scanning (optional)
# Download EICAR test file (safe test virus)
curl -o /tmp/eicar.txt https://secure.eicar.org/eicar.com.txt
clamdscan /tmp/eicar.txt
# Should detect: Eicar-Signature
```

## Troubleshooting

### Socket Permission Issues
```bash
# Check socket exists and has correct permissions
ls -la /var/run/clamd.scan/clamd.sock

# Should show: srw-rw-rw- clamscan clamscan

# Fix permissions if needed
sudo chmod 666 /var/run/clamd.scan/clamd.sock
```

### Service Not Starting
```bash
# View service logs
sudo journalctl -u clamd@scan -n 50

# Check configuration
sudo clamd --config-file=/etc/clamd.d/scan.conf --debug
```

### Database Update Issues
```bash
# Manual database update
sudo freshclam

# Check database location
ls -lah /var/lib/clamav/

# If freshclam fails, check network connectivity
curl -I https://database.clamav.net/
```

### Testing File Scanning
```bash
# Create a test file
echo "test content" > /tmp/test.txt

# Scan with clamdscan
clamdscan /tmp/test.txt

# Should return: /tmp/test.txt: OK
```

## Automated Updates

ClamAV virus definitions should update automatically via cron. To verify:

```bash
# Check if freshclam service is enabled
sudo systemctl status clamav-freshclam

# Enable if not running
sudo systemctl enable clamav-freshclam
sudo systemctl start clamav-freshclam
```

## Memory Considerations

ClamAV can use significant memory. On AWS EC2 free tier (t2.micro with 1GB RAM):

```bash
# Monitor memory usage
free -h

# If memory is tight, consider reducing MaxThreads in scan.conf
sudo nano /etc/clamd.d/scan.conf
# Change: MaxThreads 6  (instead of 12)

# Restart service after changes
sudo systemctl restart clamd@scan
```

## Integration with Node.js

The backend is configured to connect to ClamAV at:
- Socket: `/var/run/clamd.scan/clamd.sock`
- Timeout: 300000ms (5 minutes for large files)

No additional configuration needed in the application.
