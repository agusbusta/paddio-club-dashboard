import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { Info, AccessTime, MonetizationOn, Group } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, type: 'spring', stiffness: 60 }
  }),
};

export const Configuracion: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const cards = [
    {
      title: 'Datos del Club',
      icon: <Info sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: 'Contacto',
      icon: <Group sx={{ fontSize: 40, color: 'secondary.main' }} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: 'primary.main' }}>
        Configuración
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Información del Club" icon={<Info />} iconPosition="start" />
          <Tab label="Horarios" icon={<AccessTime />} iconPosition="start" />
          <Tab label="Precios" icon={<MonetizationOn />} iconPosition="start" />
          <Tab label="Usuarios" icon={<Group />} iconPosition="start" />
        </Tabs>

        <TabPanel value={value} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(91,225,44,0.15)' }}
                style={{ borderRadius: 16 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    minHeight: 140,
                    boxShadow: '0 4px 24px rgba(10,34,57,0.08)',
                    border: '2px solid',
                    borderColor: i === 0 ? 'primary.main' : 'secondary.main',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer',
                  }}
                  elevation={0}
                >
                  {card.icon}
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
                    {card.title}
                  </Typography>
                  {/* Aquí irá el formulario o información */}
                </Paper>
              </motion.div>
            ))}
          </Box>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom>
            Configuración de Horarios
          </Typography>
          {/* Aquí irá la configuración de horarios */}
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Typography variant="h6" gutterBottom>
            Configuración de Precios
          </Typography>
          {/* Aquí irá la configuración de precios */}
        </TabPanel>

        <TabPanel value={value} index={3}>
          <Typography variant="h6" gutterBottom>
            Gestión de Usuarios
          </Typography>
          {/* Aquí irá la gestión de usuarios */}
        </TabPanel>
      </Paper>
    </Box>
  );
}; 