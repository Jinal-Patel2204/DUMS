'use client';

import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';

export interface RowActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: 'error' | 'inherit';
  dividerBefore?: boolean;
}

interface RowActionsProps {
  onEdit?: () => void;
  menuItems: RowActionMenuItem[];
}

export function RowActions({ onEdit, menuItems }: RowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (action: () => void) => {
    handleMenuClose();
    action();
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'center' }}>
      {onEdit && (
        <Button
          size="small"
          variant="contained"
          startIcon={<EditOutlined sx={{ fontSize: '0.875rem' }} />}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1.5,
            py: 0.5,
            borderRadius: 5,
            minWidth: 'auto',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            boxShadow: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            },
          }}
        >
          Edit
        </Button>
      )}

      <IconButton
        size="small"
        onClick={handleMenuOpen}
        sx={{
          width: 30,
          height: 30,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <MoreHorizOutlined sx={{ fontSize: 16 }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              borderRadius: 2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              border: 1,
              borderColor: 'divider',
              mt: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {menuItems.map((item, idx) => [
          item.dividerBefore && <Divider key={`div-${idx}`} sx={{ my: 0.5 }} />,
          <MenuItem
            key={idx}
            onClick={() => handleItemClick(item.onClick)}
            sx={{
              fontSize: '0.8125rem',
              py: 1,
              color: item.color === 'error' ? 'error.main' : 'text.primary',
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ color: item.color === 'error' ? 'error.main' : 'text.secondary', minWidth: 32 }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText>
              <Typography sx={{ fontSize: '0.8125rem' }}>{item.label}</Typography>
            </ListItemText>
          </MenuItem>,
        ])}
      </Menu>
    </Box>
  );
}
