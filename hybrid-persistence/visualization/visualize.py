#!/usr/bin/env python3
"""
Redis Hybrid Persistence Mode Visualization Script
Görselleştirme ve analiz için Python scripti
"""

import subprocess
import json
import re
import time
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.animation import FuncAnimation
import numpy as np

class RedisVisualizer:
    def __init__(self, container='redis-hybrid'):
        self.container = container
        self.data_history = {
            'timestamps': [],
            'aof_sizes': [],
            'base_sizes': []
        }
    
    def docker_exec(self, command):
        """Docker container içinde komut çalıştır"""
        try:
            result = subprocess.run(
                f'docker exec {self.container} {command}',
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")
            return None
    
    def get_persistence_info(self):
        """Redis persistence bilgilerini al"""
        info = self.docker_exec('redis-cli INFO persistence')
        if not info:
            return None
        
        data = {}
        for line in info.split('\n'):
            if ':' in line and not line.startswith('#'):
                key, value = line.split(':', 1)
                data[key.strip()] = value.strip()
        
        return data
    
    def check_aof_file(self):
        """AOF dosyası bilgilerini kontrol et"""
        # Dosya var mı?
        exists = self.docker_exec('test -f /data/appendonly.aof && echo "yes" || echo "no"')
        if exists != 'yes':
            return {'exists': False, 'has_rdb': False, 'size': 0}
        
        # Dosya boyutu
        size_str = self.docker_exec('stat -c%s /data/appendonly.aof 2>/dev/null || stat -f%z /data/appendonly.aof 2>/dev/null')
        size = int(size_str) if size_str else 0
        
        # RDB preamble kontrolü
        first_bytes = self.docker_exec('head -c 5 /data/appendonly.aof 2>/dev/null')
        has_rdb = first_bytes == 'REDIS'
        
        return {
            'exists': True,
            'has_rdb': has_rdb,
            'size': size
        }
    
    def visualize_aof_structure(self):
        """AOF dosya yapısını görselleştir"""
        aof_info = self.check_aof_file()
        persistence = self.get_persistence_info()
        
        if not aof_info['exists']:
            print("⚠ AOF dosyası henüz oluşturulmadı.")
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # AOF Dosya Yapısı
        if aof_info['has_rdb']:
            base_size = int(persistence.get('aof_base_size', 0))
            current_size = int(persistence.get('aof_current_size', 0))
            aof_size = current_size - base_size
            
            # Pie chart
            sizes = [base_size, aof_size]
            labels = ['RDB Preamble', 'AOF Commands']
            colors = ['#3498db', '#2ecc71']
            explode = (0.05, 0)
            
            ax1.pie(sizes, explode=explode, labels=labels, colors=colors,
                   autopct='%1.1f%%', shadow=True, startangle=90)
            ax1.set_title('AOF File Structure\n(Hybrid Mode)', fontsize=14, fontweight='bold')
        else:
            ax1.text(0.5, 0.5, 'RDB Preamble\nNot Found\n\nRun BGREWRITEAOF\nto enable hybrid mode',
                    ha='center', va='center', fontsize=12,
                    bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            ax1.set_title('AOF File Structure\n(Old Format)', fontsize=14, fontweight='bold')
        
        # Bar chart - Dosya boyutları
        if persistence:
            base_size = int(persistence.get('aof_base_size', 0))
            current_size = int(persistence.get('aof_current_size', 0))
            
            categories = ['RDB Preamble', 'AOF Commands', 'Total']
            sizes_mb = [
                base_size / (1024 * 1024),
                (current_size - base_size) / (1024 * 1024),
                current_size / (1024 * 1024)
            ]
            colors_bar = ['#3498db', '#2ecc71', '#e74c3c']
            
            bars = ax2.bar(categories, sizes_mb, color=colors_bar, alpha=0.7)
            ax2.set_ylabel('Size (MB)', fontsize=12)
            ax2.set_title('File Size Breakdown', fontsize=14, fontweight='bold')
            ax2.grid(axis='y', alpha=0.3)
            
            # Değerleri çubukların üzerine yaz
            for bar, size in zip(bars, sizes_mb):
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height,
                        f'{size:.2f} MB',
                        ha='center', va='bottom', fontsize=10)
        
        plt.tight_layout()
        plt.savefig('aof_structure.png', dpi=150, bbox_inches='tight')
        print("✓ AOF structure visualization saved as 'aof_structure.png'")
        plt.show()
    
    def visualize_performance_comparison(self):
        """Persistence modlarının performans karşılaştırması"""
        # Örnek veriler (gerçek testlerden alınabilir)
        modes = ['RDB Only', 'Hybrid Mode', 'AOF Only']
        load_times = [2, 5, 45]  # saniye
        file_sizes = [45, 55, 180]  # MB
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Yükleme süreleri
        colors = ['#e74c3c', '#3498db', '#f39c12']
        bars1 = ax1.barh(modes, load_times, color=colors, alpha=0.7)
        ax1.set_xlabel('Loading Time (seconds)', fontsize=12)
        ax1.set_title('Loading Performance Comparison', fontsize=14, fontweight='bold')
        ax1.grid(axis='x', alpha=0.3)
        
        for i, (bar, time) in enumerate(zip(bars1, load_times)):
            ax1.text(time + 1, bar.get_y() + bar.get_height()/2,
                    f'{time}s', ha='left', va='center', fontsize=11, fontweight='bold')
        
        # Dosya boyutları
        bars2 = ax2.barh(modes, file_sizes, color=colors, alpha=0.7)
        ax2.set_xlabel('File Size (MB)', fontsize=12)
        ax2.set_title('File Size Comparison', fontsize=14, fontweight='bold')
        ax2.grid(axis='x', alpha=0.3)
        
        for i, (bar, size) in enumerate(zip(bars2, file_sizes)):
            ax2.text(size + 2, bar.get_y() + bar.get_height()/2,
                    f'{size} MB', ha='left', va='center', fontsize=11, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('performance_comparison.png', dpi=150, bbox_inches='tight')
        print("✓ Performance comparison saved as 'performance_comparison.png'")
        plt.show()
    
    def real_time_monitoring(self, duration=60, interval=2):
        """Real-time monitoring grafiği"""
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('AOF Size (bytes)', fontsize=12)
        ax.set_title('Real-time AOF Size Monitoring', fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3)
        
        start_time = time.time()
        timestamps = []
        sizes = []
        
        line, = ax.plot([], [], 'b-', linewidth=2, marker='o', markersize=4)
        
        def update(frame):
            if time.time() - start_time > duration:
                return line,
            
            persistence = self.get_persistence_info()
            if persistence:
                current_size = int(persistence.get('aof_current_size', 0))
                timestamps.append(time.time() - start_time)
                sizes.append(current_size)
                
                line.set_data(timestamps, sizes)
                ax.relim()
                ax.autoscale_view()
            
            return line,
        
        ani = FuncAnimation(fig, update, interval=interval * 1000, blit=True)
        plt.tight_layout()
        plt.show()
    
    def print_status(self):
        """Durum bilgilerini yazdır"""
        persistence = self.get_persistence_info()
        aof_info = self.check_aof_file()
        
        print("\n" + "="*60)
        print("Redis Hybrid Persistence Mode - Status")
        print("="*60)
        
        if persistence:
            print(f"\n📊 Persistence Status:")
            print(f"   AOF Enabled: {'✓' if persistence.get('aof_enabled') == '1' else '✗'}")
            print(f"   RDB Preamble: {'✓' if persistence.get('aof_use_rdb_preamble') == '1' else '✗'}")
            print(f"   Rewrite In Progress: {'✓' if persistence.get('aof_rewrite_in_progress') == '1' else '✗'}")
            
            print(f"\n💾 File Sizes:")
            current = int(persistence.get('aof_current_size', 0))
            base = int(persistence.get('aof_base_size', 0))
            print(f"   AOF Current Size: {current / (1024*1024):.2f} MB")
            print(f"   AOF Base Size: {base / (1024*1024):.2f} MB")
            print(f"   AOF Commands Size: {(current - base) / (1024*1024):.2f} MB")
        
        if aof_info['exists']:
            print(f"\n📁 AOF File:")
            print(f"   Exists: ✓")
            print(f"   Size: {aof_info['size'] / (1024*1024):.2f} MB")
            print(f"   Has RDB Preamble: {'✓' if aof_info['has_rdb'] else '✗'}")
        else:
            print(f"\n📁 AOF File: ✗ Not created yet")
        
        print("="*60 + "\n")


def main():
    import sys
    
    visualizer = RedisVisualizer()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'status':
            visualizer.print_status()
        elif command == 'structure':
            visualizer.visualize_aof_structure()
        elif command == 'performance':
            visualizer.visualize_performance_comparison()
        elif command == 'monitor':
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            visualizer.real_time_monitoring(duration=duration)
        else:
            print("Usage:")
            print("  python visualize.py status       - Print status")
            print("  python visualize.py structure     - Visualize AOF structure")
            print("  python visualize.py performance   - Performance comparison")
            print("  python visualize.py monitor [sec] - Real-time monitoring")
    else:
        visualizer.print_status()
        visualizer.visualize_aof_structure()


if __name__ == '__main__':
    main()

