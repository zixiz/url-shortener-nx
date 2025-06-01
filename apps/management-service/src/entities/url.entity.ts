// apps/management-service/src/entities/url.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('urls')
export class Url {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16, unique: true, name: 'short_id' })
  shortId!: string;

  @Column({ type: 'text', name: 'long_url', nullable: false })
  longUrl!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string | null;

  // For the new architecture, clickCount will be primarily in Redis.
  // You can choose to:
  // 1. Remove clickCount from this PostgreSQL entity entirely.
  // 2. Keep it as a periodically synced backup or for historical analysis (updated less frequently).
  // For now, let's keep it but acknowledge its primary source will be Redis for real-time stats.
  // If kept, the Management Service's stats endpoint will read from Redis, not this column for live data.
  @Column({ type: 'integer', default: 0, name: 'click_count' })
  clickCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}