
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ConversationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
}

const ConversationFilters: React.FC<ConversationFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedChannel,
  onChannelChange
}) => {
  return (
    <div className="p-3 lg:p-4 border-b border-border space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Conversas</h2>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Buscar conversa"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Channel Filter */}
      <Select value={selectedChannel} onValueChange={onChannelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os canais</SelectItem>
          <SelectItem value="Canal pessoal">Canal pessoal</SelectItem>
          <SelectItem value="Quero direito">Quero direito</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ConversationFilters;
